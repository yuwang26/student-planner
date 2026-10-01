package com.studentplanner.service;

import com.studentplanner.dto.HomeworkDtos.HomeworkRequest;
import com.studentplanner.dto.HomeworkDtos.HomeworkResponse;
import com.studentplanner.dto.HomeworkDtos.HomeworkUpdateRequest;
import com.studentplanner.model.Course;
import com.studentplanner.model.Homework;
import com.studentplanner.model.User;
import com.studentplanner.repository.HomeworkRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class HomeworkService {

    private final HomeworkRepository homeworkRepository;
    private final CourseService courseService;

    public HomeworkService(HomeworkRepository homeworkRepository, CourseService courseService) {
        this.homeworkRepository = homeworkRepository;
        this.courseService = courseService;
    }

    public List<HomeworkResponse> listHomework(User user) {
        return homeworkRepository.findByUserIdOrderByDueDateAsc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    public List<HomeworkResponse> listDueSoon(User user) {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        return homeworkRepository.findByUserIdAndDueDateBefore(user.getId(), tomorrow.plusDays(1))
                .stream()
                .filter(h -> h.getStatus() != Homework.Status.DONE)
                .map(this::toResponse).toList();
    }

    @Transactional
    public HomeworkResponse createHomework(HomeworkRequest req, User user) {
        Course course = courseService.findOwned(req.courseId(), user);
        Homework hw = new Homework(req.title(), req.description(), req.dueDate(), course);
        return toResponse(homeworkRepository.save(hw));
    }

    @Transactional
    public HomeworkResponse updateHomework(Long id, HomeworkUpdateRequest req, User user) {
        Homework hw = findOwned(id, user);
        if (req.title() != null) hw.setTitle(req.title());
        if (req.description() != null) hw.setDescription(req.description());
        if (req.dueDate() != null) hw.setDueDate(req.dueDate());
        if (req.status() != null) hw.setStatus(req.status());
        if (req.courseId() != null) {
            Course course = courseService.findOwned(req.courseId(), user);
            hw.setCourse(course);
        }
        return toResponse(homeworkRepository.save(hw));
    }

    @Transactional
    public void deleteHomework(Long id, User user) {
        Homework hw = findOwned(id, user);
        homeworkRepository.delete(hw);
    }

    private Homework findOwned(Long id, User user) {
        return homeworkRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Homework not found"));
    }

    HomeworkResponse toResponse(Homework h) {
        boolean dueSoon = !h.getDueDate().isAfter(LocalDate.now().plusDays(1))
                && h.getStatus() != Homework.Status.DONE;
        return new HomeworkResponse(
                h.getId(), h.getTitle(), h.getDescription(), h.getDueDate(), h.getStatus(),
                h.getCourse().getId(), h.getCourse().getName(), h.getCourse().getColor(),
                dueSoon);
    }
}
