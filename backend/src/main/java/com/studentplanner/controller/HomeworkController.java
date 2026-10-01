package com.studentplanner.controller;

import com.studentplanner.dto.HomeworkDtos.HomeworkRequest;
import com.studentplanner.dto.HomeworkDtos.HomeworkResponse;
import com.studentplanner.dto.HomeworkDtos.HomeworkUpdateRequest;
import com.studentplanner.model.User;
import com.studentplanner.service.AuthService;
import com.studentplanner.service.HomeworkService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/homework")
public class HomeworkController {

    private final HomeworkService homeworkService;
    private final AuthService authService;

    public HomeworkController(HomeworkService homeworkService, AuthService authService) {
        this.homeworkService = homeworkService;
        this.authService = authService;
    }

    @GetMapping
    public List<HomeworkResponse> list(@AuthenticationPrincipal UserDetails ud) {
        return homeworkService.listHomework(getUser(ud));
    }

    @GetMapping("/due-soon")
    public List<HomeworkResponse> dueSoon(@AuthenticationPrincipal UserDetails ud) {
        return homeworkService.listDueSoon(getUser(ud));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HomeworkResponse create(@Valid @RequestBody HomeworkRequest req,
                                   @AuthenticationPrincipal UserDetails ud) {
        return homeworkService.createHomework(req, getUser(ud));
    }

    @PutMapping("/{id}")
    public HomeworkResponse update(@PathVariable Long id,
                                   @RequestBody HomeworkUpdateRequest req,
                                   @AuthenticationPrincipal UserDetails ud) {
        return homeworkService.updateHomework(id, req, getUser(ud));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        homeworkService.deleteHomework(id, getUser(ud));
    }

    private User getUser(UserDetails ud) {
        return authService.getCurrentUser(ud.getUsername());
    }
}
