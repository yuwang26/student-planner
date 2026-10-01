package com.studentplanner.dto;

import com.studentplanner.model.Homework;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class HomeworkDtos {

    public record HomeworkRequest(
            @NotBlank String title,
            String description,
            @NotNull LocalDate dueDate,
            @NotNull Long courseId
    ) {}

    public record HomeworkUpdateRequest(
            String title,
            String description,
            LocalDate dueDate,
            Long courseId,
            Homework.Status status
    ) {}

    public record HomeworkResponse(
            Long id,
            String title,
            String description,
            LocalDate dueDate,
            Homework.Status status,
            Long courseId,
            String courseName,
            String courseColor,
            boolean dueSoon   // true when dueDate is today or within next 24 hours
    ) {}
}
